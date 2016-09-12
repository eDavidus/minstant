Chats = new Mongo.Collection("chats");

var emojiBase = [
  {emojiName:":smile:"}, 
  {emojiName:":smiley:"},
  {emojiName:":cry:"}, 
  {emojiName:":angry:"},
  {emojiName:":joy:"},
  {emojiName:":smile_cat:"},
  {emojiName:":smiley_cat:"},
  {emojiName:":alien:"},
  {emojiName:":anchor:"},
  {emojiName:":ambulance:"},
  {emojiName:":angel:"},
  {emojiName:":balloon:"},
  {emojiName:":bath:"},
  {emojiName:":bee:"},
  {emojiName:":bell:"},
  {emojiName:":bird:"},
  {emojiName:":birthday:"},
  {emojiName:":boat:"},
  {emojiName:":zzz:"},
  {emojiName:":wolf:"},
  {emojiName:":wave:"},
  {emojiName:":warning:"},
  {emojiName:":volcano:"},
  {emojiName:":train:"},
  {emojiName:":umbrella:"}
  ];


if (Meteor.isClient) {
  // subscribe to chat collection and users
  Meteor.subscribe("chats");
  Meteor.subscribe("users");
  
  // set up the main template the the router will use to build pages
  Router.configure({
    layoutTemplate: 'ApplicationLayout'
  });
  // specify the top level route, the page users see when they arrive at the site
  Router.route('/', function () {
    console.log("rendering root /");
    this.render("navbar", {to:"header"});
    this.render("lobby_page", {to:"main"});  
  });

  // specify a route that allows the current user to chat to another users
  Router.route('/chat/:_id', function () {
    // the user they want to chat to has id equal to 
    // the id sent in after /chat/... 
    var otherUserId = this.params._id;
    // find a chat that has two users that match current user id
    // and the requested user id
    
    if(!Meteor.user()) {
      $("#brand").click();
      alert("You need to login");
      return;
    }
    
    var filter = {$or:[
                {user1Id:Meteor.userId(), user2Id:otherUserId}, 
                {user2Id:Meteor.userId(), user1Id:otherUserId}
                ]};
    var chat = Chats.findOne(filter);
    console.log(Chats.find(filter).count());
    // if (!chat){// no chat matching the filter - need to insert a new one
    //   chatId2 = Meteor.call("createChat", Meteor.userId(), otherUserId); 
    //   console.log("from router "+chatId2);
    //   chatId = Chats.findOne(filter)._id;
    //   console.log("chat id after "+chatId);
    //   // Chats.insert({user1Id:Meteor.userId(), user2Id:otherUserId});
    // }
    if (!chat){// no chat matching the filter - need to insert a new one
      Meteor.call("createChat", Meteor.userId(), otherUserId, function(err, res) {
        // callback function to avaoid duplicated chats
        console.log("from router "+res);
        if (Chats.find(filter).count() > 1) { // a second chat with same user was created
          Meteor.call("removeChat", res); 
          return;
        }
        chatId = res;
      }); 
    }
    else {// there is a chat going already - use that. 
      chatId = chat._id;
    }
    if (chatId){// looking good, save the id to the session
      Session.set("chatId",chatId);
    }
    this.render("navbar", {to:"header"});
    this.render("chat_page", {to:"main"});        
  });

  ///
  // helper functions 
  /// 
  Template.available_user_list.helpers({
    users:function(){
      return Meteor.users.find();
    }
  })
 Template.available_user.helpers({
    getUsername:function(userId){
      user = Meteor.users.findOne({_id:userId});
      return user.profile.username;
    }, 
    isMyUser:function(userId){
      if (userId == Meteor.userId()){
        return true;
      }
      else {
        return false;
      }
    }
  })


  Template.chat_page.helpers({
    messages:function(){
      var chat = Chats.findOne({_id:Session.get("chatId")});
      return chat.messages;
    }, 
    other_user:function(){
      return ""
    }, 
    emojis:function(){
      return emojiBase;
    }
  })
  

 Template.chat_page.events({
  // this event fires when the user sends a message on the chat page
  'submit .js-send-chat':function(event){
    // stop the form from triggering a page reload
    event.preventDefault();
    
    if (!Meteor.user()) {
      alert("You need to login");
    }
    // see if we can find a chat object in the database
    // to which we'll add the message
    var chat = Chats.findOne({_id:Session.get("chatId")});
    if (chat){// ok - we have a chat to use
      var msgs = chat.messages; // pull the messages property
      if (!msgs){// no messages yet, create a new array
        msgs = [];
      }
      var postedBy = Meteor.user().profile.username;
      var avatar = Meteor.user().profile.avatar;
      var time =  new Date();
      // is a good idea to insert data straight from the form
      // (i.e. the user) into the database?? certainly not. 
      // push adds the message to the end of the array
      msgs.push({
        text: event.target.chat.value, 
        postedBy: postedBy,
        avatar: avatar,
        time: time
      });
      // reset the form
      event.target.chat.value = "";
      // put the messages array onto the chat object
      chat.messages = msgs;
      // update the chat object in the database.
      // Chats.update(chat._id, chat);
      Meteor.call("addMsg", chat._id, chat)
    }
  },
  'click .js-emotic':function(event) {
    // add coresponding emotic texts to form
    var emotic = event.target.alt;
    console.log(emotic);
    var elt = document.getElementById('msgForm');
    elt.value = elt.value + emotic;
  }
  // 'click .js-toggle-emoji':function(event) {
  //   $("#emotics").toggle("slow");
  // }
 })
}

// start up script that creates some users for testing
// users have the username 'user1@test.com' .. 'user8@test.com'
// and the password test123 

if (Meteor.isServer) {
  Meteor.startup(function () {
    if (!Meteor.users.findOne()){
      for (var i=1;i<9;i++){
        var email = "user"+i+"@test.com";
        var username = "user"+i;
        var avatar = "ava"+i+".png"
        console.log("creating a user with password 'test123' and username/ email: "+email);
        Meteor.users.insert({profile:{username:username, avatar:avatar}, emails:[{address:email}],services:{ password:{"bcrypt" : "$2a$10$I3erQ084OiyILTv8ybtQ4ON6wusgPbMZ6.P33zzSDei.BbDL.Q4EO"}}});
      }
    } 
  });
  
  // request server to publish chats according to rules
  Meteor.publish("chats", function() {
    return Chats.find({
      $or: [ // or filter
        {user1Id: this.userId},
        {user2Id: this.userId}
        ]
    });
  })
  
    Meteor.publish("users", function() {
    return Meteor.users.find();
  })
}

Meteor.methods({
  addMsg:function(chatId, chatMsg) {
    console.log("add text here");
    console.log("chat id "+chatId)
    console.log("chat message ");
    console.log(chatMsg);
    Chats.update(chatId, chatMsg);
  },
  createChat:function(user1Id, user2Id) {
    var id = Chats.insert({user1Id:user1Id, user2Id:user2Id});
    console.log("from create chat method "+id);
    return id;
  },
  removeChat:function(id) {
    Chats.remove({_id:id});
  }
})
